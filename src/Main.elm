port module Main exposing (..)

import Browser
import Browser.Dom as Dom
import Browser.Events as Events
import Dict exposing (Dict)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Json.Decode as JD
import Json.Encode as JE
import Math.Vector2 as Vec2


main : Program Flags Model Msg
main =
    Browser.document
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


type alias Flags =
    {}


type Mouse
    = OffScreen
    | OnScreen Bool Vec2.Vec2


type Model
    = NoShape Mouse
    | AShape Mouse Shape


type Shape
    = Segments (List Segment)


type Segment
    = Move Vec2.Vec2
    | Line Vec2.Vec2


type Msg
    = MouseDown Mouse
    | MouseUp Mouse
    | MouseMove Mouse


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( NoShape OffScreen, Cmd.none )



-- MODEL


subscriptions : Model -> Sub Msg
subscriptions model =
    case model of
        NoShape _ ->
            Sub.batch [ Events.onMouseDown (JD.map MouseDown decodeMouse) ]

        AShape _ _ ->
            Sub.batch
                [ Events.onMouseDown (JD.map MouseDown decodeMouse)
                , Events.onMouseUp (JD.map MouseUp decodeMouse)
                , Events.onMouseMove (JD.map MouseMove decodeMouse)
                ]


port draw : JE.Value -> Cmd msg


port draw2 : JE.Value -> Cmd msg


drawShape : Shape -> Cmd Msg
drawShape shape =
    draw (encodeShape shape)



-- UPDATE


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case ( model, msg ) of
        ( NoShape _, MouseDown mouse ) ->
            case mouse of
                -- Create a move segment at mouse coords when clicked
                OnScreen down coords ->
                    let
                        newShape =
                            Segments [ Move coords ]
                    in
                    ( AShape mouse newShape, drawShape newShape )

                OffScreen ->
                    ( model, Cmd.none )

        ( NoShape _, MouseUp _ ) ->
            ( model, Cmd.none )

        ( NoShape _, MouseMove _ ) ->
            ( model, Cmd.none )

        ( AShape mouse (Segments segments), MouseDown newMouse ) ->
            case mouse of
                OnScreen False coords ->
                    let
                        newShape =
                            Segments segments
                    in
                    ( AShape newMouse newShape, Cmd.none )

                OnScreen _ _ ->
                    ( model, Cmd.none )

                OffScreen ->
                    ( model, Cmd.none )

        ( AShape mouse (Segments segments), MouseUp newMouse ) ->
            case newMouse of
                OnScreen down coords ->
                    let
                        newShape =
                            Segments (Line coords :: segments)
                    in
                    ( AShape newMouse newShape, drawShape newShape )

                OffScreen ->
                    ( model, Cmd.none )

        ( AShape mouse shape, MouseMove (OnScreen down coords) ) ->
            ( AShape mouse shape, draw2 (encodeVec2 coords) )

        ( AShape mouse shape, MouseMove OffScreen ) ->
            ( AShape mouse shape, Cmd.none )



-- VIEW


view : Model -> Browser.Document Msg
view model =
    { title = "", body = [ canvas [ Html.Attributes.id "canvas" ] [] ] }


encodeVec2 : Vec2.Vec2 -> JE.Value
encodeVec2 vec2 =
    JE.object [ ( "x", JE.float (Vec2.getX vec2) ), ( "y", JE.float (Vec2.getY vec2) ) ]


encodeSegment : Segment -> JE.Value
encodeSegment segment =
    case segment of
        Move coords ->
            JE.object [ ( "type", JE.string "move" ), ( "coords", encodeVec2 coords ) ]

        Line coords ->
            JE.object [ ( "type", JE.string "line" ), ( "coords", encodeVec2 coords ) ]


encodeShape : Shape -> JE.Value
encodeShape (Segments segments) =
    JE.list encodeSegment segments


decodeMouse : JD.Decoder Mouse
decodeMouse =
    JD.map2 OnScreen
        decodeButtons
        (JD.map2
            Vec2.vec2
            (JD.field "pageX" JD.float)
            (JD.field "pageY" JD.float)
        )



{- What happens when the user is dragging, but the "mouse up" occurs outside
   the browser window? We need to stop listening for mouse movement and end the
   drag. We use MouseEvent.buttons to detect this:
       https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
   The "buttons" value is 1 when "left-click" is pressed, so we use that to
   detect zombie drags.
-}


decodeButtons : JD.Decoder Bool
decodeButtons =
    JD.field "buttons" (JD.map (\buttons -> buttons == 1) JD.int)
